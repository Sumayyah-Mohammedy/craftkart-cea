#!/usr/bin/env bash
# Zero-downtime rolling deploy of one tier:
#   1. record the new image tag in SSM Parameter Store
#   2. start an ASG instance refresh (new instances boot with the new tag,
#      old ones are drained from the load balancer only after new ones are healthy)
#   3. wait until the refresh succeeds (fail the pipeline otherwise)
# Usage: rolling-deploy.sh <asg-name> <ssm-parameter-name> <image-tag>
set -euo pipefail
ASG="$1"; PARAM="$2"; TAG="$3"
REGION="${AWS_REGION:?AWS_REGION not set}"

echo "==> $ASG: setting $PARAM = $TAG"
aws ssm put-parameter --region "$REGION" --name "$PARAM" --value "$TAG" --type String --overwrite >/dev/null

start_refresh() {
  aws autoscaling start-instance-refresh --region "$REGION" \
    --auto-scaling-group-name "$ASG" \
    --strategy Rolling \
    --preferences '{"MinHealthyPercentage":100,"MaxHealthyPercentage":200,"InstanceWarmup":120,"SkipMatching":false}' \
    --query InstanceRefreshId --output text
}

# If a refresh is already running (e.g. started by terraform), wait for it first
for i in $(seq 1 60); do
  if ID=$(start_refresh 2>/tmp/refresh.err); then break; fi
  if grep -q "InstanceRefreshInProgress" /tmp/refresh.err; then
    echo "    another refresh is in progress, waiting..."; sleep 20
  else
    cat /tmp/refresh.err; exit 1
  fi
done
echo "==> $ASG: instance refresh $ID started"

for i in $(seq 1 90); do   # up to 30 minutes
  read -r STATUS PCT <<<"$(aws autoscaling describe-instance-refreshes --region "$REGION" \
      --auto-scaling-group-name "$ASG" --instance-refresh-ids "$ID" \
      --query 'InstanceRefreshes[0].[Status,PercentageComplete]' --output text)"
  echo "    $(date +%H:%M:%S) status=$STATUS complete=${PCT}%"
  case "$STATUS" in
    Successful) echo "==> $ASG deployed $TAG"; exit 0 ;;
    Failed|Cancelled|RollbackSuccessful|RollbackFailed) echo "::error::$ASG refresh ended with $STATUS"; exit 1 ;;
  esac
  sleep 20
done
echo "::error::timed out waiting for $ASG"; exit 1

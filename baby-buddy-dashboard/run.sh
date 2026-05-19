#!/usr/bin/with-contenv bashio

# Read configuration from HA add-on options
export BABY_BUDDY_URL=$(bashio::config 'baby_buddy_url')
export BABY_BUDDY_API_KEY=$(bashio::config 'baby_buddy_api_key')
export REFRESH_INTERVAL=$(bashio::config 'refresh_interval')
export DEMO_MODE=$(bashio::config 'demo_mode')
export UNIT_SYSTEM=$(bashio::config 'unit_system')
export FEEDING_ALERT_HOURS=$(bashio::config 'feeding_alert_hours')
export DIAPER_ALERT_HOURS=$(bashio::config 'diaper_alert_hours')
export HA_NOTIFY_SERVICE=$(bashio::config 'ha_notify_service')

bashio::log.info "Starting Baby Buddy Dashboard..."
bashio::log.info "Connecting to Baby Buddy at: ${BABY_BUDDY_URL}"

cd /app
exec python3 -m uvicorn backend.server:app \
    --host 0.0.0.0 \
    --port 8099 \
    --log-level info \
    --no-server-header

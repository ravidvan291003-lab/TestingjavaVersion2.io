#!/bin/bash
# ==============================================================================
# Apache Tomcat Runner Script for Sales & Inventory System
# ==============================================================================

set -e

echo "=========================================================="
echo "    Starting Apache Tomcat Runner for Sales & Inventory   "
echo "=========================================================="

# Check for CATALINA_HOME or local Tomcat installation
if [ -z "$CATALINA_HOME" ]; then
  if [ -d "/opt/tomcat" ]; then
    export CATALINA_HOME="/opt/tomcat"
  elif [ -d "/usr/local/tomcat" ]; then
    export CATALINA_HOME="/usr/local/tomcat"
  else
    echo "Notice: CATALINA_HOME environment variable is not set."
    echo "You can run with Docker: docker compose -f tomcat/docker-compose.yml up -d"
    echo "Or install Tomcat 10 and export CATALINA_HOME=/path/to/apache-tomcat"
  fi
fi

# If Maven is available, package WAR file
if command -v mvn &> /dev/null; then
  echo "[1/3] Packaging WAR with Maven..."
  mvn clean package -DskipTests
  WAR_FILE=$(find target -name "*.war" | head -n 1)
  if [ -n "$WAR_FILE" ] && [ -n "$CATALINA_HOME" ]; then
    echo "[2/3] Deploying $WAR_FILE to $CATALINA_HOME/webapps/pos.war..."
    cp "$WAR_FILE" "$CATALINA_HOME/webapps/pos.war"
  fi
else
  echo "[1/3] Maven not found. Skipping WAR compilation step."
fi

# Start Tomcat
if [ -n "$CATALINA_HOME" ] && [ -f "$CATALINA_HOME/bin/startup.sh" ]; then
  echo "[3/3] Launching Tomcat Catalina..."
  "$CATALINA_HOME/bin/startup.sh"
  echo "Tomcat running! Open browser at: http://localhost:8080/pos"
else
  echo "Ready to launch with Docker Compose:"
  echo "  cd tomcat && docker compose up -d"
fi

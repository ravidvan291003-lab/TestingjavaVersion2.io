@echo off
REM ==============================================================================
REM Apache Tomcat Runner Script for Windows
REM ==============================================================================

echo ==========================================================
echo    Starting Apache Tomcat Runner for Sales ^& Inventory   
echo ==========================================================

IF "%CATALINA_HOME%"=="" (
  echo CATALINA_HOME is not set.
  echo If Tomcat is installed, set CATALINA_HOME=C:\apache-tomcat-10.1.x
  echo Alternatively, run using Docker:
  echo   docker compose -f tomcat\docker-compose.yml up -d
) ELSE (
  echo Deploying to %CATALINA_HOME%\webapps\pos.war...
  IF EXIST target\pos_inventory.war (
    copy /Y target\pos_inventory.war %CATALINA_HOME%\webapps\pos.war
  )
  echo Launching Tomcat...
  call "%CATALINA_HOME%\bin\startup.bat"
  echo Tomcat started! Open: http://localhost:8080/pos
)
pause

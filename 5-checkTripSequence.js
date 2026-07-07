function checkTripSequence(){

const props =
PropertiesService.getScriptProperties();

Logger.log(
"TRP_SEQ = "
+
props.getProperty("TRP_SEQ")
);

}
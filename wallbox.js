// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: magic;
// File Variables
const iCloud = true;
const saveData = iCloud ? FileManager.iCloud() : FileManager.local();
const logoFileName = 'wallboxLogoWhite.png';
const saveFolderName = 'wallboxStatus';

const wallboxAPI = importModule('wallboxAPI');

const apiCalls = {};

// Variables
const widgetTitle = args.widgetParameter ? args.widgetParameter : 'chargerName'; // Also the name of evCharger you want to display
const chargerName = widgetTitle;
const locationName = 'Home';
const email = 'wallbox-email';
const password = 'wallbox-password';
const efficiency = 3;

const dateFormat = 'MM/dd hh:mm a';
const timeFormatter = new DateFormatter();
timeFormatter.dateFormat = dateFormat;

const maxLineWidth = 300;
const normalLineHeight = 35;
const headerFontSize = 24;
const subHeadingFontSize = 11;
const infoFontSize = 10;
const connectedFontSize = 8;
const dateFontSize = 7;
const headerFont = Font.boldMonospacedSystemFont(headerFontSize);
const infoFont = Font.systemFont(infoFontSize);
const connectedFont = Font.systemFont(connectedFontSize);
const updatedAtFont = Font.systemFont(dateFontSize);

let widget = await createWidget();

// Check where the script is running
if (config.runsInWidget) {
  // Runs inside a widget so add it to the homescreen widget
  Script.setWidget(widget);
} else {
  // Show the medium widget inside the app
  widget.presentMedium();
}
Script.complete();

async function createWidget() {
  // Create new empty ListWidget instance
  let listwidget = new ListWidget();

  // Set new background color
  listwidget.backgroundColor = new Color('#000000');

  // Fetch meter data
  let signin = await wallboxAPI.signin(email, password);
  let userID = await wallboxAPI.getID(signin.token, signin.user_id);
  let user = await wallboxAPI.getUser(signin.token, userID);
  let chargerGroups = await wallboxAPI.getChargers(signin.token);
  let evCharger = await wallboxAPI.getCharger(
    chargerGroups,
    locationName,
    chargerName
  );
  let status = await wallboxAPI.getChargerStatus(signin.token, evCharger.id);
  let sessionTimestamp = status.config_data.sync_timestamp * 1000;
  let sessionTime = new Date(sessionTimestamp);
  log(evCharger);
  // Heading
  await createHeader(listwidget);
  listwidget.addSpacer(1);

  // Current Status
  let statusText = await wallboxAPI.getWallboxStatus(status.status_id);
  addStyledText(
    listwidget,
    `${statusText.emoji} ${statusText.status}`,
    infoFont
  );
  listwidget.addSpacer(8);

  // Session Info
  addStyledText(listwidget, 'Latest Session Info', infoFont);
  listwidget.addSpacer(1);
  addStyledText(
    listwidget,
    `🔋: ${evCharger.addedEnergy.toFixed(2)} ${evCharger.energyUnit}`,
    infoFont
  );
  listwidget.addSpacer(1);
  addStyledText(listwidget, `💰: $${calculateCost(evCharger)}`, infoFont);
  listwidget.addSpacer(1);
  addStyledText(
    listwidget,
    `🧭: ${distanceAdded(evCharger.addedEnergy)} Miles`,
    infoFont
  );
  listwidget.addSpacer(1);
  addStyledText(
    listwidget,
    `⚡️: ${evCharger.chargingPower.toFixed(1)} ${evCharger.powerUnit} / hr`,
    infoFont
  );
  listwidget.addSpacer(8);

  // Charging Time
  addStyledText(
    listwidget,
    `${formatChargingTime(evCharger)} Charging`,
    infoFont
  );
  addStyledText(
    listwidget,
    'Started: ' + timeFormatter.string(sessionTime),
    connectedFont
  );
  listwidget.addSpacer(5);

  // Updated Time
  addStyledText(
    listwidget,
    'updated: ' + timeFormatter.string(new Date()),
    updatedAtFont
  );

  // Return the created widget
  return listwidget;
}

function distanceAdded(kwh) {
  return (kwh * efficiency).toFixed(2);
}

function calculateCost(charger) {
  let price = charger.energyPrice;
  let unit = charger.addedEnergy;
  return (price * unit).toFixed(2);
}

function formatChargingTime(charger) {
  let time = charger.chargingTime;
  let hour = ~~(time / 60 / 60);
  let minutes = ((time / 60) % 60).toFixed(0);

  let formatted = '';

  if (minutes < 60 && minutes > 0) {
    formatted = minutes + ' mins';
  }
  formatted = hour
    ? `${hour} hour${hour > 1 ? 's' : ''} ${formatted}`
    : formatted;

  return formatted;
}

async function createHeader(stack) {
  let titleStack = stack.addStack();
  const logo = await getLogo();
  const imgWidget = titleStack.addImage(logo);
  imgWidget.imageSize = new Size(15, 30);

  let headerText = addStyledText(titleStack, ' ' + widgetTitle, headerFont);
  //headerText.size = new Size(60, normalLineHeight);
}

async function addStyledText(stackToAddTo, text, fontStyle) {
  let textHandler = await stackToAddTo.addText(text);
  textHandler.font = fontStyle;
  textHandler.textColor = new Color('#FFFFFF');

  return textHandler;
}

async function getLogo() {
  let path = getFilePath(logoFileName, saveData);
  const fileDownloaded = await saveData.isFileDownloaded(path);
  if (!fileDownloaded) {
    await saveData.downloadFileFromiCloud(path);
  }
  return saveData.readImage(path);
}

function getFilePath(fileName, saveData) {
  let dirPath = saveData.joinPath(
    saveData.documentsDirectory(),
    saveFolderName
  );
  if (!saveData.fileExists(dirPath)) {
    saveData.createDirectory(dirPath);
  }
  return saveData.joinPath(dirPath, fileName);
}

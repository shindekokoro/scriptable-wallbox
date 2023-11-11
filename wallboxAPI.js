// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: download;
const wallboxUrl = 'https://my.wallbox.com';
const userAPI = 'https://user-api.wall-box.com';
const api = 'https://api.wall-box.com';

const headers = (type, token) => {
  return {
    Partner: 'wallbox',
    Accept: 'application/json',
    'Content-Type': 'application/json;charset=UTF-8',
    Authorization: `${type} ${token}`
  };
};

const wallboxAPI = {
  signin: async function (email, password) {
    log('Signin: Retrieving token');

    let login = `${email}:${password}`;
    let encodedLogin = Data.fromString(login).toBase64String();
    try {
      let url = `${userAPI}/users/signin`;
      let request = new Request(url);
      request.headers = headers('Basic', encodedLogin);
      let response = await request.loadJSON();

      log('Successfully Signed In');
      return response.data.attributes;
    } catch (err) {
      return logError(err);
    }
  },
  getID: async function (token, userID) {
    log('getID: Getting ID');

    try {
      let url = `${api}/v4/users/${userID}/id`;
      let request = new Request(url);
      request.headers = headers('Bearer', token);
      let response = await request.loadJSON();

      return response.data.attributes.value;
    } catch (err) {
      return logError(err);
    }
  },
  getUser: async function (token, userID) {
    log(`getUser: Getting User info for ${userID}`);

    try {
      let url = `${api}/v2/user/${userID}`;
      let request = new Request(url);
      request.headers = headers('Bearer', token);
      let response = await request.loadJSON();

      log(`Found account for ${response.data.name} ${response.data.surname}`);
      return response.data;
    } catch (err) {
      return logError(err);
    }
  },
  getChargers: async function (token) {
    log('getChargers: Getting Chargers on Account');

    try {
      let url = `${api}/v3/chargers/groups`;
      let request = new Request(url);
      request.headers = headers('Bearer', token);
      let response = await request.loadJSON();

      return response.result.groups;
    } catch (err) {
      return logError(err);
    }
  },
  getCharger: async function (chargers, locationName, chargerName) {
    let evCharger;
    await chargers.forEach(async (location) => {
      if (location.name !== locationName) {
        return log(`Skipping ${location.name}`);
      }
      log(`Found location for ${location.name}`);
      await location.chargers.forEach((charger) => {
        if (charger.name !== chargerName) {
          return log(`Skipping ${charger.name}`);
        }
        log(`Found charger ${charger.name} [${charger.id}]`);
        evCharger = charger;
      });
    });
    return evCharger;
  },
  getChargerData: async function (token, chargerID) {
    log(`getChargerData: Getting Data of ${chargerID}`);

    try {
      let url = `${api}/v2/charger/${chargerID}`;
      let request = new Request(url);
      request.headers = headers('Bearer', token);
      let response = await request.loadJSON();

      return response.data.chargerData;
    } catch (err) {
      return logError(err);
    }
  },
  getChargerStatus: async function (token, chargerID) {
    log(`getChargerStatus: Getting Status of ${chargerID}`);

    try {
      let url = `${api}/chargers/status/${chargerID}`;
      let request = new Request(url);
      request.headers = headers('Bearer', token);

      return await request.loadJSON();
    } catch (err) {
      return logError(err);
    }
  },
  getChargerConfig: async function (token, chargerID) {
    log(`getChargerConfig: Getting Config for ${chargerID}`);

    try {
      let url = `${api}/chargers/config/${chargerID}`;
      let request = new Request(url);
      request.headers = headers('Bearer', token);
      let response = await request.loadJSON();

      return response.data;
    } catch (err) {
      return logError(err);
    }
  },
  getWallboxStatus: async function (code) {
    switch (code) {
      case 164:
      case 180:
      case 181:
      case 183:
      case 184:
      case 185:
      case 186:
      case 187:
      case 188:
      case 189:
        return { status: 'Waiting', emoji: '🔵' };
      case 193:
      case 194:
      case 195:
        return { status: 'Charging', emoji: '🟢' };
      case 161:
      case 162:
        return { status: 'Ready', emoji: '🟡' };
      case 178:
      case 182:
        return { status: 'Paused', emoji: '⏸️' };
      case 177:
      case 179:
        return { status: 'Scheduled', emoji: '⏱️' };
      case 196:
        return { status: 'Discharging', emoji: '🪫' };
      case 14:
      case 15:
        return { status: 'Error', emoji: '⛔️' };
      case 209:
      case 210:
      case 165:
        return { status: 'Locked', emoji: '🔒' };
      case 166:
        return { status: 'Updating', emoji: '🔄' };
      case 0:
      case 163:
      default:
        return { status: 'Disconnected', emoji: '⛓️‍💥' };
    }
  }
};

module.exports = wallboxAPI;

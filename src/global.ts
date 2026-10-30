const BASE_URL = '';//'http://localhost';
const API_BASE_URL = '';//`${BASE_URL}:3000`;
const API_BASE_CHAT_URL = '';//`${BASE_URL}:3003`;
const API_BASE_UPLOAD_URL = '';//`${BASE_URL}:3002`;
const API_BASE_QONLY_URL = '';//`${BASE_URL}:3001`;
const API_BASE_CALL_URL = `${BASE_URL}/callio`;//`${BASE_URL}:3006`;
const API_FILES_URL = '';//`${BASE_URL}:3006`;
const TOUID_AGENT = '4f82224a71503071459d1ffa1e1ea16ab11b20c17e1fb';
const WS_CHAT = "ws://localhost:5173";
export const REVIEW_PANEL = '93cac5e4-f5dd-448a-9330-486dc63e19f3';
export const TRACK_VIEW_LOVE_OBJECT_ID = 'ad1bb5f179b7a0f8';
export const TRACK_VIEW_SHARE_OBJECT_ID = 'ad1bb5f179b7a0f8';
export const CHART_OBJECT_ID = 'd62c95b6-669a-422b-b9ba-a73a2b9fbc82';
export const EC_HTML_CONTENT = 'c5ad252b-81eb-410e-b506-bbcc194ed64c';
export const DOMAIN_TOUID_AGENT = () => {
    return TOUID_AGENT;
}

export const DOMAIN_FILES = () => {
    return API_FILES_URL;
}

export const DOMAIN_WEB = () => {
    return API_BASE_URL;
}

export const DOMAIN_CHAT_WEB = () => {
    return API_BASE_CHAT_URL;
}

export const DOMAIN_UPLOAD_WEB = () => {
    return API_BASE_UPLOAD_URL;
}

export const DOMAIN_QONLY_WEB = () => {
    return API_BASE_QONLY_URL;
}

export const DOMAIN_CALL_WEB = () => {
    return API_BASE_CALL_URL;
}

export const DOMAIN_WS_CHAT = () => {
    return WS_CHAT;
}

export const REVIEW_PANEL_DM = () => {
    return REVIEW_PANEL;
}
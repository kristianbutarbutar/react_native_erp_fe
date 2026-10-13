const BASE_URL = '';//'http://localhost';
const API_BASE_URL = '';//`${BASE_URL}:3000`;
const API_BASE_CHAT_URL = '';//`${BASE_URL}:3003`;
const API_BASE_UPLOAD_URL = '';//`${BASE_URL}:3002`;
const API_BASE_QONLY_URL = '';//`${BASE_URL}:3001`;
const API_BASE_CALL_URL = `${BASE_URL}/callio`;//`${BASE_URL}:3006`;
const API_FILES_URL = '';//`${BASE_URL}:3006`;
const TOUID_AGENT = '4f82224a71503071459d1ffa1e1ea16ab11b20c17e1fb';
const WS_CHAT = `http://localhost/ws`;

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
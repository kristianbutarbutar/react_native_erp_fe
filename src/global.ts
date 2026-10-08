const BASE_URL = '';//'http://localhost';
const API_BASE_URL = '';//`${BASE_URL}:3000`;
const API_BASE_CHAT_URL = '';//`${BASE_URL}:3003`;
const API_BASE_UPLOAD_URL = '';//`${BASE_URL}:3002`;
const API_BASE_QONLY_URL = '';//`${BASE_URL}:3001`;
const API_BASE_CALL_URL = `${BASE_URL}/callio`;//`${BASE_URL}:3006`;
const API_FILES_URL = '';//`${BASE_URL}:3006`;
const WS_CHAT = `${BASE_URL}/ws`;


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
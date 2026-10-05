const API_BASE_URL = 'http://localhost:3000';
const API_BASE_CHAT_URL = 'http://localhost:3003';
const API_BASE_UPLOAD_URL = 'http://localhost:3002';
const API_BASE_QONLY_URL = 'http://localhost:3001';
const API_BASE_CALL_URL = 'http://localhost:3006';

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
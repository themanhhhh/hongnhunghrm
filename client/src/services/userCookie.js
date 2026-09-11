const USER_COOKIE_NAME = 'bravo_hrm_user';
const USER_COOKIE_MAX_AGE = 60 * 60 * 24;

const cookieSecurity = () => window.location.protocol === 'https:' ? '; Secure' : '';

export const setUserCookie = (user) => {
    if (!user) return;
    document.cookie = `${USER_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(user))}; Max-Age=${USER_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${cookieSecurity()}`;
};

export const clearUserCookie = () => {
    document.cookie = `${USER_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax${cookieSecurity()}`;
};

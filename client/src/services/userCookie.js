const USER_COOKIE_NAME = 'bravo_hrm_user';
const USER_COOKIE_MAX_AGE = 60 * 60 * 24;

const cookieSecurity = () => window.location.protocol === 'https:' ? '; Secure' : '';

export const setUserCookie = (user) => {
    if (!user) return;
    document.cookie = `${USER_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(user))}; Max-Age=${USER_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${cookieSecurity()}`;
};

export const getUserCookie = () => {
    const cookie = document.cookie.split('; ').find((item) => item.startsWith(`${USER_COOKIE_NAME}=`));
    if (!cookie) return null;

    try {
        const value = JSON.parse(decodeURIComponent(cookie.slice(USER_COOKIE_NAME.length + 1)));
        return {
            ...value,
            id: value.id || value.user_id,
            fullName: value.fullName || value.full_name || value.name,
            full_name: value.full_name || value.fullName || value.name,
            roleName: value.roleName || value.role_name || value.role,
            role_name: value.role_name || value.roleName || value.role,
            deptName: value.deptName || value.department_name || value.department,
            department_name: value.department_name || value.deptName || value.department
        };
    } catch {
        return null;
    }
};

export const clearUserCookie = () => {
    document.cookie = `${USER_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax${cookieSecurity()}`;
};

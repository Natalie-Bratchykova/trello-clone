import {API_URL} from "../config.ts";

export const getUserProfileUrl = (profileImage?: string | null) => {
  return profileImage ? `${API_URL}${profileImage}`: undefined;
}

export const getLoggedUserInfo = function(){
    return  JSON.parse(localStorage.getItem('user') || '{}');
}

export const setUserDataToStorage = function(userObject){
  localStorage.setItem('user', JSON.stringify(userObject));
}


export const setUserLoggInStatus = function(status:boolean){
  localStorage.setItem('isAuthenticated', status.toString());
}

export const getUserLoggInStatus = function(){
  return JSON.parse( localStorage.getItem('isAuthenticated'));
}
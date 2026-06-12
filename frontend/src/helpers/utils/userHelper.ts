import {API_URL} from "../config";

export const getUserProfileUrl = (profileImage?: string | null) => {
    let currentImage = profileImage;
    window.addEventListener('update-image', (e)=>{
        let image = e.detail?.data;
        currentImage = image? image: profileImage;
        console.log('current image 1', currentImage);
    });
    console.log('current image 2', currentImage);
  return currentImage ? `${API_URL}${currentImage}`: undefined;
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
const BASE_URL = 'https://ping-prod.herokuapp.com/'
const API = 'api'
const VERSION = 'v1'
const API_URL = `${BASE_URL}${API}/${VERSION}`;


export const environment = {
    production: true,
    firebase: {
        apiKey: 'AIzaSyAcR-hQL00RZ7nlSH_Ry80lxcLdCGhIRao',
        authDomain: 'circles-4d081.firebaseapp.com',
        databaseURL: 'https://circles-4d081.firebaseio.com',
        projectId: 'circles-4d081',
        storageBucket: 'circles-4d081.appspot.com',
        messagingSenderId: '1002096850890',
        appId: '1:1002096850890:web:2d74c84b63048faaccc133',
        measurementId: 'G-LE1HC0KW0F'
    },
    mapbox: {
        style: 'mapbox://styles/sreegrandhe/ckak2ig0j0u9v1ipcgyh9916y?optimize=true',
        accessToken: 'pk.eyJ1Ijoic3JlZWdyYW5kaGUiLCJhIjoiY2thanhpaDByMDBxZDJybGdxMnQ5ZnNxaiJ9.mkcuMoDmiPapnplpJ_lgaQ'
    },
    apiURL: {
        default: API_URL,
        events: `${API_URL}/events/`,
        users: `${API_URL}/users/`,
        geoPing: `${API_URL}/geoping/`,
        links: `${API_URL}/links/`,
        requests: `${API_URL}/requests/`,
        markers: `${API_URL}/markers/`,
    }
};

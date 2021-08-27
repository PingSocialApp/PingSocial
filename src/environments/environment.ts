// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    firebase:
        {
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
        default: 'http://localhost:8080/api/v1/',
        events: 'http://localhost:8080/api/v1/events/',
        users:'http://localhost:8080/api/v1/users/',
        geoPing:'http://localhost:8080/api/v1/geoping/',
        links:'http://localhost:8080/api/v1/links/',
        requests:'http://localhost:8080/api/v1/requests/',
        markers: 'http://localhost:8080/api/v1/markers/'
    }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.

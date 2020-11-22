// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  //apiUrl: "http://localhost:4001/api",
  apiUrl: "https://my-json-server.typicode.com/tanyazhong/the-data-grid-mock-server",
  port: "2345",
  useFakeData: true
  // useFakeData: false
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related e rror stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
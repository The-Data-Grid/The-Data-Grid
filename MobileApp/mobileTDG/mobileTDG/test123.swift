//
//  test123.swift
//  mobileTDG
//
//  Created by David Trung Nguyen on 8/10/21.
//

import Foundation
import SwiftUI

func myCall123(name: String, word: String){
   //preparing the url
   let url = URL(string: "thedatagrid.org/api/login")
   // let url = URL(string: "https://jsonplaceholder.typicode.com/todos")
   guard let requestUrl = url else { fatalError() }

   // preparing the request object
   var request = URLRequest(url: requestUrl)
   request.httpMethod = "POST"

   // request parameters - is sent to the request body
   // let postString = "hello=300&title=My urgent task&completed=false";
   let postString = "email="+name+"&"+"pass="+word;

   // http request body
   request.httpBody = postString.data(using: String.Encoding.utf8);

   // the http request
   let task = URLSession.shared.dataTask(with: request) { (data, response, error) in

           // checking for error
           if let error = error {
               print("Error took place \(error)")
               return
           }

           // convert the data to string
           if let data = data, let dataString = String(data: data, encoding: .utf8) {
               print("Response data string:\n \(dataString)")
           }
   }
   task.resume()

}

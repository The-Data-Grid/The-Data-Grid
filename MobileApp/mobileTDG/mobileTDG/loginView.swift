//
//  ContentView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 11/15/20.
//

import SwiftUI
import Foundation

struct loginView: View {
    @EnvironmentObject var viewRouter: ViewRouter
    
    // userInput + environment variables
    @State private var username = ""
    @State private var password = ""
    @State private var userAuth = false
    
    //UI framework with images, text etc
    var body: some View {
            VStack(alignment: /*@START_MENU_TOKEN@*/.center/*@END_MENU_TOKEN@*/, spacing: 15) {
                Spacer()
                //see reusable stylings for detail on following stumps
                globeLogo()
                dataGridTitle()
                Spacer()
                
                //Textfields for user input, binded to vars
                TextField("Email", text: $username)
                  .textFieldStyle(RoundedBorderTextFieldStyle())
                  .font(Font.custom("IBMPlexSans", size: 23, relativeTo: Font.TextStyle.body))
                  .autocapitalization(.none)
                TextField("Password", text: $password)
                  .textFieldStyle(RoundedBorderTextFieldStyle())
                  .font(Font.custom("IBMPlexSans", size: 23, relativeTo: Font.TextStyle.body))
                  .autocapitalization(.none)
                //SecureField("Password", text: $password).textFieldStyle(RoundedBorderTextFieldStyle()).font(Font.custom("IBMPlexSans", size: 23, relativeTo: Font.TextStyle.body))
                
                // Navigates to home page if user is Authorized
                Button(action: {
                    if(authorizeUser(user: username, password: password)){
                        UserDefaults.standard.set(username, forKey: "username")
                        UserDefaults.standard.set(true, forKey: "loggedIn")
                        userAuth = true
                        viewRouter.currentPage = .tab
                    }
                }) {
                    submitButtonContent()
                }
                Spacer()
            }.padding()
    }
}

// check if user information is valid (will call api eventually)
func authorizeUser(user: String, password: String) -> Bool {
   // print(user, password)
   checkUser(name: user, word: password)
   print(test)
   return true
   /*
   if (!user.isEmpty && !password.isEmpty) {
        return true
    }
    return false
   */
}

// Canvas preview setup
struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        loginView().environmentObject(ViewRouter())
    }
}

/*
* Subviews
* minimize bulk from styling
*/
struct submitButtonContent: View {
    var body: some View {
        Text("SUBMIT").font(Font.custom("IBMPlexSans", size: 20, relativeTo: Font.TextStyle.body))
            .frame(minWidth:0, maxWidth: 350)
            .padding()
            .background(Color("green"))
            .foregroundColor(.white)
            .cornerRadius(10)
    }
}



func checkUser(name: String, word: String) -> String{
   //preparing the url
   let url = URL(string: "https://thedatagrid.org/api/login")
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

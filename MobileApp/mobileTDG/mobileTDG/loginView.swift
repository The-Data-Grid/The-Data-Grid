//
//  ContentView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 11/15/20.
//

import SwiftUI
import Foundation

class loginViewModel: ObservableObject {
   // userInput + environment variables
   @Published var username = ""
   @Published var password = ""
   @Published var wrongAuth = false
   @Published var userAuth = false {
      didSet{
         if userAuth == true {
            UserDefaults.standard.set(username, forKey: "username")
            UserDefaults.standard.set(true, forKey: "loggedIn")
         }
      }
   }
}



struct loginView: View {
   @EnvironmentObject var viewRouter: ViewRouter
   @ObservedObject var loginObject : loginViewModel

   func login() {
      viewRouter.currentPage = .tab
   }

    func authorizeUser(user: String, password: String) {
      var check = "none"
      //preparing the url
      let url = URL(string: "https://thedatagrid.org/api/login")
      guard let requestUrl = url else { fatalError() }

      // preparing the request object
      var request = URLRequest(url: requestUrl)
      request.httpMethod = "POST"

      // request parameters - is sent to the request body
      let postString = "email="+user+"&"+"pass="+password;

      // http request body
      request.httpBody = postString.data(using: String.Encoding.utf8);

      // the http request
      let task = URLSession.shared.dataTask(with: request)  { (data, response, error) in

              // checking for error
              if let error = error {
                  print("Error took place \(error)")
                  return
              }

              // convert the data to string
              if let data = data, let dataString = String(data: data, encoding: .utf8) {
                  check = dataString
                  // check if message is wrong
                  if check == "password matched and you logged in"{
                     loginObject.userAuth = true

                  }
                  else {
                     // wrong password combination
                     loginObject.wrongAuth  = true
                  }
              }
      }
      task.resume()
   }


    //UI framework with images, text etc
    var body: some View {
            VStack(alignment: /*@START_MENU_TOKEN@*/.center/*@END_MENU_TOKEN@*/, spacing: 15) {
                Spacer()
                //see reusable stylings for detail on following stumps
                globeLogo()
                dataGridTitle()
                Spacer()
                
                //Textfields for user input, binded to vars
               TextField("Email", text: $loginObject.username)
                  .textFieldStyle(RoundedBorderTextFieldStyle())
                  .font(Font.custom("IBMPlexSans", size: 23, relativeTo: Font.TextStyle.body))
                  .autocapitalization(.none)

               SecureField("Password", text: $loginObject.password)
                  .textFieldStyle(RoundedBorderTextFieldStyle())
                  .font(Font.custom("IBMPlexSans", size: 23, relativeTo: Font.TextStyle.body))
                  .autocapitalization(.none)
                
                // Navigates to home page if user is Authorized
                Button(action: {
                  authorizeUser(user: loginObject.username, password: loginObject.password)
                }) {
                    submitButtonContent()
                }

               // attempt to put in alert
                .alert(isPresented: $loginObject.wrongAuth) {
                  Alert(title: Text("Login Failed"),
                        message: Text("The username or password you entered was incorrect. Please try again."),
                        dismissButton: .default(Text("OK")))
                }


                Spacer()
            }.padding().onChange(of: loginObject.userAuth, perform: { value in
               if value {
                  login()
               }

            })
    }
}

// check if user information is valid (will call api eventually)

// Canvas preview setup
struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        loginView(loginObject: loginViewModel()).environmentObject(ViewRouter())
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



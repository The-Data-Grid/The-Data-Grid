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
                TextField("Email", text: $username).textFieldStyle(RoundedBorderTextFieldStyle()).font(Font.custom("IBMPlexSans", size: 23, relativeTo: Font.TextStyle.body))
                SecureField("Password", text: $password).textFieldStyle(RoundedBorderTextFieldStyle()).font(Font.custom("IBMPlexSans", size: 23, relativeTo: Font.TextStyle.body))
                
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
    if (!user.isEmpty && !password.isEmpty) {
        return true
    }
    return false
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


//model for data
struct loginData: Codable, Identifiable {
   let id = UUID()
   let email: String
   let password: String
}

// apiCall Class
class apiCall {
   // function to get login info
   func getLoginInfo(completion: @escaping([loginData]) -> ()){
      //check to see if url is valid
      guard let url = URL(string: "thedatagrid.org/api/login") else { return }

      //URL session to call data form URL
      URLSession.shared.dataTask(with: url) { (data, _, _) in
         //info variable to store info of decoded json object
         let info = try! JSONDecoder().decode([loginData].self, from: data!)

         print(info)

         DispatchQueue.main.async{
            completion(info)
         }
      }
      // need resume to run the API call to URL
      .resume()
   }
}

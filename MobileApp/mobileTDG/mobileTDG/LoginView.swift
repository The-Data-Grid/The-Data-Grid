//
//  ContentView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 11/15/20.
//

import SwiftUI

struct LoginView: View {
    // userInput + environment variables
    @State private var username = ""
    @State private var password = ""
    @State private var userAuth = false
    
    //UI framework with images, text etc
    var body: some View {
        NavigationView {
            VStack{
                Text("the data grid")
                    .font(Font.custom("IBMPlexSans", size: 40, relativeTo: Font.TextStyle.largeTitle))
                    .multilineTextAlignment(.center).padding()
                Image(decorative: "TDG-globe").padding()
                Spacer()
                
                //Textfields for user input, binded to vars
                TextField("Username or email", text: $username).textFieldStyle(RoundedBorderTextFieldStyle()).font(Font.custom("IBMPlexSans", size: 23, relativeTo: Font.TextStyle.body)).padding()
                TextField("Password", text: $password).textFieldStyle(RoundedBorderTextFieldStyle()).font(Font.custom("IBMPlexSans", size: 23, relativeTo: Font.TextStyle.body)).padding()
                
                // Navigates to home page if user is Authorized
                NavigationLink(
                    destination: SettingsView(),
                    isActive: $userAuth) {
                    Button(action: {
                        if(authorizeUser(user: username, password: password)){
                            userAuth = true
                        }
                    }) {
                        Text("SUBMIT").font(Font.custom("IBMPlexSans", size: 20, relativeTo: Font.TextStyle.body))
                            .frame(minWidth:0, maxWidth: 350)
                            .padding()
                            .background(Color("green"))
                            .foregroundColor(.white)
                            .cornerRadius(10)
                        }
                }
                Spacer()
            }
        }
    }
}

// check if user information is valid (will call api eventually)
func authorizeUser(user: String, password: String) -> Bool {
    if (!user.isEmpty && !password.isEmpty) {
        return true
    }
    return false
}

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView()
    }
}

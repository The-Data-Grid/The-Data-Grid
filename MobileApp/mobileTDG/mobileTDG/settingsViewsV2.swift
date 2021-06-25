//
//  settingsViewsV2.swift
//  mobileTDG
//
//  Created by David Trung Nguyen on 5/7/21.
//

import Foundation
import SwiftUI

struct settingsView2: View {
   @EnvironmentObject var viewRouter: ViewRouter

   @State private var showAccountSettings = false
   @State private var showPVSettings = false

   @State private var photoSync = UserDefaults.standard.bool(forKey: "psync")
   @State private var autoSync = UserDefaults.standard.bool(forKey: "async")

   private var name = UserDefaults.standard.string(forKey: "username")

   var body: some View {
       VStack(alignment: .leading) {
           Text("Settings").font(.largeTitle).padding()
           Form {
                   DisclosureGroup("Account", isExpanded: $showAccountSettings) {
                       Text("Name: \(name ?? "")")
                       Button(action: {
                           viewRouter.currentPage = .login
                       }) {
                        Text("Logout").foregroundColor(.red)
                       }
                   }.accentColor(Color.black)


                  DisclosureGroup("Photos and Videos", isExpanded: $showPVSettings) {
                       Toggle("Sync photos", isOn: $photoSync).toggleStyle(SwitchToggleStyle())
                   }.accentColor(Color.black)

                   Toggle("Auto-Sync", isOn: $autoSync)
                       .toggleStyle(SwitchToggleStyle())

           }
           .background(Color.white)
           Text("Terms").padding(.leading)
          Text("Version 1.0.0").padding(.leading)
       }
   }

   

}


struct SettingsViewV2_Previews: PreviewProvider {
    static var previews: some View {
        settingsView2().environmentObject(ViewRouter())

    }
}

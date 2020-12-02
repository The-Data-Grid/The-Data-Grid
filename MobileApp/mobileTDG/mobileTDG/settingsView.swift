//
//  SettingsView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 11/18/20.
//

import SwiftUI

struct settingsView: View {
    @State private var showAccountSettings = false
    @State private var showPVSettings = false
    
    @State private var photoSync = false
    @State private var autoSync = false
    
    var body: some View {
        VStack(alignment: .leading) {
            Text("Settings").font(.largeTitle).padding()
            Form {
                    DisclosureGroup("Account", isExpanded: $showAccountSettings) {
                            Text("Name")
                            Text("Logout")
                    }.accentColor(Color.black)
                    /*
                    Divider()
                    
                    Group{
                        HStack() {
                            Text("Account")
                            Spacer()
                            Button(action: {showAccountSettings = !showAccountSettings}) {
                                Image(systemName: "chevron.down")
                            }
                        }
                        Divider()
                    
                        if(showAccountSettings){
                            Text("Name")
                            Divider()
                        }
                    }
    */
                    DisclosureGroup("Photos and Videos", isExpanded: $showPVSettings) {
                        Toggle("Sync photos", isOn: $photoSync).toggleStyle(CheckboxToggleStyle())
                    }.accentColor(Color.black)
                    
                    Toggle("Auto-Sync", isOn: $autoSync)
                        .toggleStyle(CheckboxToggleStyle())
                     
            }
            Text("Terms").padding(.leading)
            Text("Version 1.0.0").padding(.leading)
        }
    }
}

struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        settingsView()
    }
}

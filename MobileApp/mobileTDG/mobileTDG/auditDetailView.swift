//
//  auditView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 1/3/21.
//

import SwiftUI

struct auditDetailView: View {
    @EnvironmentObject var viewRouter: ViewRouter
    @State private var auditName = "Audit Submission 1"
    @State private var editingName = false
    @State var showGlobalPresets = false
    @State var showAddRoot = false
    
    var body: some View {
        NavigationView {
            VStack {
                HStack {
                    TextField("", text: $auditName).font(.title).disabled(!editingName)
                    Button(action: {editingName = !editingName}, label: {
                        Image(systemName: !editingName ? "pencil" : "checkmark")
                            .font(Font.system(.title).bold()).accentColor(.black)
                    })
                }.padding(20)
                Divider().padding(.top,-5)
                HStack(spacing: 30){
                    Button(action: {
                        showGlobalPresets = true},
                           label: {
                        Text("Global Presets")
                            .font(Font.custom("IBMPlexSans", size: 15, relativeTo: Font.TextStyle.body))
                            .padding(9)
                            .padding([.leading,.trailing], 18)
                            .background(Color("green").opacity(Double(0.5)))
                            .foregroundColor(Color.black)
                            .cornerRadius(20)
                    }).sheet(isPresented: $showGlobalPresets, content: {
                        globalPresetsView()
                    })
                    Button(action: {
                        showAddRoot = true},
                           label: {
                        Text("Add Root Features")
                            .font(Font.custom("IBMPlexSans", size: 15, relativeTo: Font.TextStyle.body))
                            .padding(9)
                            .padding([.leading,.trailing], 10)
                            .background(Color("green").opacity(Double(0.5)))
                            .foregroundColor(Color.black)
                            .cornerRadius(20)
                    }).sheet(isPresented: $showAddRoot, content: {
                        addRootFeaturesView()
                    })
                }.padding([.top,.bottom], 5)
                Divider()
                Spacer()
            }
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                leading: Button(action: {
                    viewRouter.currentTab = .home
                }, label: {
                    Text("Save and Continue").accentColor(.black)
                }),
                trailing: Button(action:{
                    viewRouter.currentTab = .home

                }, label:{
                    Text("Cancel Changes").accentColor(.black)
                }))
        }
    }
}

struct AuditDetailView_Previews: PreviewProvider {
    static var previews: some View {
        auditDetailView()
    }
}

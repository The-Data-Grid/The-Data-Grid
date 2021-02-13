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
    
    var body: some View {
        NavigationView {
            VStack {
                HStack {
                    TextField("", text: $auditName).font(.largeTitle).disabled(!editingName)
                    Button(action: /*@START_MENU_TOKEN@*/{}/*@END_MENU_TOKEN@*/, label: {
                        Image(systemName: !editingName ? "pencil" : "checkmark")
                            .font(Font.system(.title).bold()).accentColor(.black)
                    })
                }.padding()
                Divider().background(Color.black)
                HStack{
                    Button(action: {
                        showGlobalPresets = true},
                           label: {
                        Text("Global Presets")
                            .font(Font.custom("IBMPlexSans", size: 20, relativeTo: Font.TextStyle.body))
                            .padding(12)
                            .background(Color("green").opacity(Double(0.5)))
                            .foregroundColor(Color.black)
                            .cornerRadius(20)
                    })
                    Button(action: {},
                           label: {
                        Text("Add Root Features")
                            .font(Font.custom("IBMPlexSans", size: 20, relativeTo: Font.TextStyle.body))
                            .padding(12)
                            .background(Color("green").opacity(Double(0.5)))
                            .foregroundColor(Color.black)
                            .cornerRadius(20)
                    })
                }.padding([.leading,.trailing])
                Spacer()
            }
            .sheet(isPresented: $showGlobalPresets, content: {
                globalPresetsView()
            })
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

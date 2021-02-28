//
//  homeView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 12/1/20.
//

import SwiftUI

struct tabView: View {
    @EnvironmentObject var viewRouter: ViewRouter
    @Environment(\.managedObjectContext) private var viewContext
    @State var isCommunicating = false
    
    var body: some View{
        GeometryReader { geometry in
            VStack{
                Spacer()
                switch viewRouter.currentTab {
                case .home:
                    homeView()
                case .settings:
                    settingsView()
                case .audits:
                    auditsView()
                case .detail:
                    auditDetailView()
                }
                
                Spacer()
                HStack {
                    Image(systemName: "gear")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .padding(20)
                        .frame(width: geometry.size.width/3,
                               height: viewRouter.currentTab != .settings ? 70: 75)
                        .foregroundColor(.white)
                        .onTapGesture {
                            viewRouter.currentTab = .settings
                        }
                    Image(systemName: "house")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .padding(20)
                        .frame(width: geometry.size.width/3,
                               height: viewRouter.currentTab != .home ? 70: 75)
                        .foregroundColor(.white)
                        .onTapGesture {
                            viewRouter.currentTab = .home
                        }
                    Image(systemName: "phone.fill.arrow.up.right").resizable()
                        .aspectRatio(contentMode: .fit)
                        .padding(20)
                        .frame(width: geometry.size.width/3,
                               height: 65)
                        .foregroundColor(.white)
                        .onTapGesture {
                            isCommunicating = true
                        }
                }.frame(width: geometry.size.width, height: geometry.size.height/11)
                .background(Color("green").opacity(0.80).shadow(radius: 2))
                .sheet(isPresented: $isCommunicating, content: {
                    communicationView()
                })
            }.edgesIgnoringSafeArea(.bottom)
        }
    }
}

struct TabView_Previews: PreviewProvider {
    static var previews: some View {
        tabView().environmentObject(ViewRouter()).environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
    }
}

//
//  homeView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 12/1/20.
//

import SwiftUI

struct tabView: View {
    @EnvironmentObject var viewRouter: ViewRouter
    
    var body: some View{
        GeometryReader { geometry in
            VStack{
                Spacer()
                switch viewRouter.currentTab {
                case .home:
                    homeView()
                case .settings:
                    settingsView()
                case .submitted:
                    submittedAuditsView()
                case .unsubmitted:
                    unsubmittedAuditsView()
                }
                Spacer()
                HStack {
                    Image(systemName: "house")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .padding(20)
                        .frame(width: geometry.size.width/3, height:70)
                        .foregroundColor(viewRouter.currentTab == .home ? .black : .gray)
                        .onTapGesture {
                            viewRouter.currentTab = .home
                        }
                    Image(decorative: "TDG-globe")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .padding(5)
                        .frame(width: geometry.size.width/3, height:70)
                    Image(systemName: "phone.fill.arrow.up.right").resizable()
                        .aspectRatio(contentMode: .fit)
                        .padding(20)
                        .frame(width: geometry.size.width/3, height:70)
                }.frame(width: geometry.size.width, height: geometry.size.height/11)
                .background(Color.white.shadow(radius: 2))
            }.edgesIgnoringSafeArea(.bottom)
        }
    }
}

struct TabView_Previews: PreviewProvider {
    static var previews: some View {
        tabView().environmentObject(ViewRouter())
    }
}

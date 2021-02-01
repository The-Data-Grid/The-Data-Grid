//
//  homeView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 12/1/20.
//

import SwiftUI

struct homeView: View {
    @EnvironmentObject var viewRouter: ViewRouter
    var body: some View {
        VStack (spacing: 15) {
            Button(action: {
                viewRouter.currentTab = .settings
            }, label: {
                Image(systemName: "gear")
                    .resizable()
                    .foregroundColor(.black)
                    .padding(5)
                    .frame(width: 40, height: 40)
            })
            Spacer()
            globeLogo()
            dataGridTitle()
            Spacer()
            Spacer()
            Button(action: {}, label: {
                Text("New Audit")
                    .font(Font.custom("IBMPlexSans", size: 20, relativeTo: Font.TextStyle.body))
                    .padding()
                    .frame(minWidth:0, maxWidth: 350)
                    .background(Color("green"))
                    .foregroundColor(Color(.white))
                    .cornerRadius(10)
            })
            Button(action: {
                viewRouter.currentTab = .unsubmitted},
                   label: {
                Text("Unsubmitted Audits")
                    .font(Font.custom("IBMPlexSans", size: 20, relativeTo: Font.TextStyle.body))
                    .padding()
                    .frame(minWidth:0, maxWidth: 350)
                    .background(Color("blue"))
                    .foregroundColor(Color.white)
                    .cornerRadius(10)
            })
            Button(action: {
                viewRouter.currentTab = .submitted},
                   label: {
                Text("Submitted Audits")
                    .font(Font.custom("IBMPlexSans", size: 20, relativeTo: Font.TextStyle.body))
                    .padding()
                    .frame(minWidth:0, maxWidth: 350)
                    .background(Color("blue"))
                    .foregroundColor(Color.white)
                    .cornerRadius(10)
            })
            Spacer()
        }
    }
}

struct HomeView_Previews: PreviewProvider {
    static var previews: some View {
        homeView().environmentObject(ViewRouter())
    }
}

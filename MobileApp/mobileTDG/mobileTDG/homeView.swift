//
//  homeView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 12/1/20.
//

import SwiftUI

struct homeView: View {
    @EnvironmentObject var viewRouter: ViewRouter
    @Environment(\.managedObjectContext) private var viewContext

    var body: some View {
        VStack (spacing: 15) {
            Spacer()
            globeLogo()
            dataGridTitle()
            Spacer()
            Spacer()
            Button(action: {
                    viewRouter.currentTab = .detail},
                   label: {
                Text("New Audit")
                    .font(Font.custom("IBMPlexSans", size: 20, relativeTo: Font.TextStyle.body))
                    .padding()
                    .frame(minWidth:0, maxWidth: 350)
                    .background(Color.white)
                    .foregroundColor(Color("blue"))
                    .cornerRadius(15)
                    .shadow(radius: 5)
            })
            Button(action: {
                viewRouter.currentTab = .audits},
                   label: {
                Text("View Audits")
                    .font(Font.custom("IBMPlexSans", size: 20, relativeTo: Font.TextStyle.body))
                    .padding()
                    .frame(minWidth:0, maxWidth: 350)
                    .background(Color("blue"))
                    .foregroundColor(Color.white)
                    .cornerRadius(15)
                    .shadow(radius: 5)
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

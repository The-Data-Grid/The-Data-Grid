//
//  MotherView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 12/1/20.
//

import SwiftUI

struct motherView: View {
    
    @Environment(\.managedObjectContext) private var viewContext
    @EnvironmentObject var viewRouter: ViewRouter

    let loggedIn = UserDefaults.standard.bool(forKey: "loggedIn")
    
    var body: some View {
        if(loggedIn) {
            tabView()
        } else {
            switch viewRouter.currentPage {
            case .login:
                loginView()
            case .tab:
                tabView()
            }
        }
    }
}

struct MotherView_Previews: PreviewProvider {
    static var previews: some View {
        motherView().environmentObject(ViewRouter())
            .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
    }
}

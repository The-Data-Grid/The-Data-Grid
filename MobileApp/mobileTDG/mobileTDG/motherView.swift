//
//  MotherView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 12/1/20.
//

import SwiftUI

struct motherView: View {
    
    @EnvironmentObject var viewRouter: ViewRouter
    
    var body: some View {
        GeometryReader { geometry in
            VStack{
                Rectangle()
                    .frame(width: geometry.size.width, height:50)
                    .foregroundColor(Color("blue"))
                switch viewRouter.currentPage {
                case .login:
                    loginView()
                case .tab:
                    tabView()
            }
            }.ignoresSafeArea(edges: .top)
        }
    }
}

struct MotherView_Previews: PreviewProvider {
    static var previews: some View {
        motherView().environmentObject(ViewRouter())
    }
}

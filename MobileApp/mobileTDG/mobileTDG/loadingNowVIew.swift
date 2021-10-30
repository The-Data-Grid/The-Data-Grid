//
//  loadingNowVIew.swift
//  mobileTDG
//
//  Created by David Trung Nguyen on 10/29/21.
//

import Foundation
import SwiftUI

var audits = 2

struct loadingNowView : View {
   @EnvironmentObject var viewRouter: ViewRouter
   let displayString = Text("You have sucessfully submitted/deleted ") +
      Text(String(audits)).bold() +
      Text(" audits")

   var body: some View {
      VStack(alignment: .center){
         Text("Synchronizing with Server...")
            .font(.system(size: 35, weight: .semibold))
            //.font(Font.custom("IMBPlexSans-Bold.ttf", size: 35))
            .multilineTextAlignment(.center)

         displayString
            .font(.system(size: 25))
            .multilineTextAlignment(.center)
            .padding()
         
         Image(systemName: "hourglass")
            .resizable()
            .frame(width:75, height: 125, alignment: /*@START_MENU_TOKEN@*/.center/*@END_MENU_TOKEN@*/)
            .foregroundColor(.blue)
            .padding()

         Button(action: {
            print("continue button!")
         }){
            Text("Continue to Audits")
               .frame(width: 300, height: 51)
               .font(Font.custom("IBMPlexSans", size: 20))
               .background(Color(.systemGray3))
               .foregroundColor(.black)
               .cornerRadius(20)
               .padding()
         }
      }
   }

}


struct loadingNowView_Previews: PreviewProvider{
   static var previews: some View{
      loadingNowView().environmentObject(ViewRouter())
   }
}

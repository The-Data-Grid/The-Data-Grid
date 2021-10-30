//
//  loadingDoneView .swift
//  mobileTDG
//
//  Created by David Trung Nguyen on 10/29/21.
//

import Foundation
import SwiftUI

var numberAudits = 2

struct loadingDoneView: View{
   @EnvironmentObject var viewRouter: ViewRouter

   let displayString = Text("You have sucessfully modified ") +
      Text(String(numberAudits)).bold() +
      Text(" audits")

   var body: some View{
      VStack(alignment: .center){
         Text("Sucess!")
            .font(.system(size: 35, weight: .semibold))
            //.font(Font.custom("IMBPlexSans-Bold.ttf", size: 35))
            .multilineTextAlignment(.center)

         displayString
            .font(.system(size: 25))
            .multilineTextAlignment(.center)
            .padding()

         Image(systemName: "checkmark.circle.fill")
            .resizable()
            .frame(width:100, height: 100, alignment: /*@START_MENU_TOKEN@*/.center/*@END_MENU_TOKEN@*/)
            .foregroundColor(.blue)
            .padding()


         Button(action: {
            print("continue button!")
         }){
            Text("Continue to Audits")
               // .font(Font.custom("IMBPlexSans", size: 20))
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


struct loadingDoneView_Previews: PreviewProvider{
   static var previews: some View{
      loadingDoneView().environmentObject(ViewRouter())
   }
}

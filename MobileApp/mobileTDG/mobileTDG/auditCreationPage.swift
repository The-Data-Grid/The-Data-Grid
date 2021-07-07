//
//  auditCreationPage.swift
//  mobileTDG
//
//  Created by David Trung Nguyen on 5/21/21.
//


import Foundation
import SwiftUI

struct auditCreationPage: View{
   @EnvironmentObject var viewRouter: ViewRouter

   /// variables for method
   @State var itemName: String = ""
   @State var columnName: String = ""
   @State var createNew = false


   var body: some View{
      VStack(alignment: .leading){
         Text("Audit Creation Page").font(.largeTitle).padding()

         Form{

            creationComponent()

            creationComponent()



         }


            
      }


   }


}

struct auditCreationPage_Previews: PreviewProvider {
    static var previews: some View {
        auditCreationPage().environmentObject(ViewRouter())

    }
}



struct creationComponent: View {
   var body: some View{
      VStack(alignment: .leading ) {

         HStack {
            Text("Item name")
            Spacer()
            Button("Create New"){
               /// createNew.toggle()
            }
         }
         .padding(.bottom, 5)
         .padding(.top, 5)

         Text("Column name")
            .padding(.leading, 7)
            .padding(.bottom, 5)

      }
   };
}

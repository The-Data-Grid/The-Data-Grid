//
//  testfile.swift
//  mobileTDG
//
//  Created by David Trung Nguyen on 7/6/21.
//

import Foundation

import SwiftUI

struct ContentView: View {
    //1.
    @State var comments = [loginData]()

    var body: some View {
        NavigationView {
            //3.
            List(comments) { comment in
                VStack(alignment: .leading) {
                    Text(comment.email)
                        .font(.title)
                        .fontWeight(.bold)
                    Text(comment.password)
                        .font(.subheadline)
                        .fontWeight(.bold)
                }

            }
            //2.
            .onAppear() {
               apiCall().getLoginInfo{ (comments) in
                  self.comments = comments
                }
            }.navigationTitle("Comments")
        }
    }
}



struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView().environmentObject(ViewRouter())

    }
}


//
//  communicationView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 1/31/21.
//

import SwiftUI

struct communicationView : View {
    @Environment(\.presentationMode) var mode
    @EnvironmentObject var viewRouter: ViewRouter

    var body: some View {
        NavigationView {
            Text("Woww I exist!")
                .navigationTitle("Communication")
                .navigationBarTitleDisplayMode(.large)
                .navigationBarItems(leading:
                                        Button(action: {self.mode.wrappedValue.dismiss()},
                           label: {Image(systemName: "arrow.backward").accentColor(.black)}))
        }
    }
}

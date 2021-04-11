//
//  globalPresetsView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 1/31/21.
//

import SwiftUI

struct globalPresetsView : View {
    @Environment(\.presentationMode) var mode

    var body: some View {
        NavigationView {
            VStack(alignment: .leading) {
                Divider().background(Color(.black))
                Spacer()
            }
                .navigationTitle("Global Presets")
                .navigationBarTitleDisplayMode(.large)
                .navigationBarItems(
                    leading:
                        Button(action: {self.mode.wrappedValue.dismiss()},
                           label: {
                            Text(" Cancel ")
                                .padding(8)
                                .background(Color("grey"))
                                .foregroundColor(Color.black)
                                .cornerRadius(20)}),
                    trailing:
                        Button(action: {self.mode.wrappedValue.dismiss()},
                             label: {Text(" Save ")
                                .padding(8)
                                .background(Color("grey"))
                                .foregroundColor(Color.black)
                                .cornerRadius(20)})
                             )
        }
    }
}

struct GlobalPresetsView_Previews: PreviewProvider {
    static var previews: some View {
            globalPresetsView()
    }
}

//
//  globalPresetsView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 1/31/21.
//

import SwiftUI
import SwiftyJSON

struct globalPresetsView : View {
    @Environment(\.presentationMode) var mode
    @State var globalPresets = [String]()
    
    func getRootFeatures() {
        if let jsonPath = Bundle.main.path(forResource: "testSetupObject", ofType: "json") {
            if let data = try? String(contentsOfFile: jsonPath, encoding: String.Encoding.utf8) {
                let setupObject = JSON(parseJSON: data)
                let subfeatureStartIndex = setupObject["subfeatureStartIndex"].int ?? 0
                for i in 0...subfeatureStartIndex {
                    let temp = setupObject["children"][0][i].intValue
                    globalPresets.append( setupObject["features"][temp]["frontendName"].stringValue)
                }
            }
        } else {
            print("path not loaded")
        }
    }
    
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

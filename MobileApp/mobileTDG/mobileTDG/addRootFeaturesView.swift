//
//  addRootFeaturesView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 1/31/21.
//

import SwiftUI
import SwiftyJSON

// allows the creation of lists with toggles
struct listToggle: Identifiable {
    let id = UUID()
    var add: Bool
    var name: String
}

struct addRootFeaturesView : View {
    @Environment(\.presentationMode) var mode
    @State var rootFeatures = [listToggle]()
    
    func getRootFeatures() {
        if let jsonPath = Bundle.main.path(forResource: "testSetupObject", ofType: "json") {
            if let data = try? String(contentsOfFile: jsonPath, encoding: String.Encoding.utf8) {
                let setupObject = JSON(parseJSON: data)
                let subfeatureStartIndex = setupObject["subfeatureStartIndex"].int ?? 0
                for i in 0...subfeatureStartIndex {
                    let temp = setupObject["children"][0][i].intValue
                    rootFeatures.append(listToggle(add: false, name: setupObject["features"][temp]["frontendName"].stringValue))
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
                List(rootFeatures.indices, id:\.self) { idx in
                        Toggle(isOn: self.$rootFeatures[idx].add, label: {
                            Text(self.rootFeatures[idx].name)
                        }).toggleStyle(CheckboxToggleStyle())
                        .padding()
                }.listStyle(PlainListStyle())
            }
            .onAppear(perform: getRootFeatures)
                .navigationTitle("Add Root Features")
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
                             label: {Text(" Add ")
                                .padding(8)
                                .background(Color("grey"))
                                .foregroundColor(Color.black)
                                .cornerRadius(20)})
                             )
        }
    }
}

struct addRootFeaturesView_Previews: PreviewProvider {
    static var previews: some View {
            addRootFeaturesView()
    }
}

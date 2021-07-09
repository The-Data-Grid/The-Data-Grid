//
//  addRootFeaturesView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 1/31/21.
//

import SwiftUI
import SwiftyJSON

// allows the creation of lists with toggles
class feature: Identifiable, Equatable {
    let id = UUID()
    @Published public var add: Bool
    var name: String
    
    init(add: Bool, name: String) {
        self.add = add
        self.name = name
    }
    
    // change to find if path is equal
    static func == (lhs: feature, rhs: feature) -> Bool {
        return lhs.name == rhs.name
    }
}



struct rootFeatureToggle: View {
    @Binding var selected: Bool
    var feature: String
    
    @State var deletionAlert = false
        
    init(feature: String, selected: Binding<Bool>) {
        _selected = selected
        self.feature = feature
    }
    
    var body: some View {
        HStack {
            Text(feature)
                .padding()
            Spacer()
            Image(systemName: selected ? "checkmark.square" : "square")
                .resizable()
                .frame(width: 25, height: 25)
                .padding()
                .onTapGesture {
                    selectionChanged()
                }
        }
        // consider how to track if no observations are associated
        .alert(isPresented: $deletionAlert){
            Alert(title: Text("Delete Root Feature"), message: Text("You will lose all observations associated with it"), primaryButton: .default(Text("Cancel")), secondaryButton: .default(Text("Confirm"), action: {
                selected = false
            }))
        }
    }
    
    private func selectionChanged() {
        if(selected == false){
            selected = true
        } else {
            deletionAlert = true
        }
    }
}

struct addRootFeaturesView : View {
    @Environment(\.presentationMode) var mode
    @State var rootFeatures = [feature]()
    @ObservedObject var a: audit
    
    func getRootFeatures() {
        if let jsonPath = Bundle.main.path(forResource: "testSetupObject", ofType: "json") {
            if let data = try? String(contentsOfFile: jsonPath, encoding: String.Encoding.utf8) {
                let setupObject = JSON(parseJSON: data)
                var subfeatureStartIndex = setupObject["subfeatureStartIndex"].int ?? 0
                subfeatureStartIndex -= 1
                for i in 0...subfeatureStartIndex {
                    let temp = setupObject["children"][0][i].intValue
                    let n = setupObject["features"][temp]["frontendName"].stringValue
                    let added = a.rootFeatures.contains{ element in
                        if (element.name == n) {
                            return true
                        } else {
                            return false
                        }
                    }
                    rootFeatures.append(feature(add: added, name: n))
                }
            }
        } else {
            print("path not loaded")
        }
    }
    
    //update with changes in model
    func addRootFeatures() {
        for feature in rootFeatures {
            let index = a.rootFeatures.firstIndex(of: feature)
            switch feature.add {
            case true:
                if(index == nil) {
                    a.rootFeatures.append(feature)
                }
            case false:
                if(index != nil) {
                    a.rootFeatures.remove(at: index!)
                }
            }
        }
        
        self.mode.wrappedValue.dismiss()
    }
    
    var body: some View {
        NavigationView {
            VStack(alignment: .leading) {
                Divider().background(Color(.black))
                Spacer()
                List(rootFeatures.indices, id:\.self) { idx in
                    // maybe use button instead of toggle?
                    rootFeatureToggle(feature: rootFeatures[idx].name, selected: $rootFeatures[idx].add)
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
                        Button(action: {addRootFeatures()},
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
        addRootFeaturesView(a: audit(name: "audit 1",
                                       rootFeatures: [feature(add: false, name: "Toilet")]))
    }
}

//
//  submittedAuditsView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 12/1/20.
//

import SwiftUI

struct submittedAuditsView: View {
    @EnvironmentObject var viewRouter: ViewRouter
    @Environment(\.managedObjectContext) private var viewContext
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Audit.lastUpdated, ascending: true)],
        predicate: NSPredicate(format: "submitted == true"),
        animation: .default)
    private var audits: FetchedResults<Audit>

    var body: some View{
        NavigationView {
            VStack(alignment: .leading) {
                Text("Submitted").font(.largeTitle).padding()
                Divider().background(Color(.black))
                ForEach(audits, id: \.id){ audit in
                    HStack() {
                        Text(audit.name!).font(.title)
                        Spacer()
                        VStack {
                            Text("Last updated").fontWeight(.light)
                            Text(audit.lastUpdated!, formatter: dateFormatter).fontWeight(.light)
                        }
                    }.padding([.leading,.trailing])
                    Divider().background(Color(.black))
                }
                Spacer()
            }
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                leading:
                    Button(action: {viewRouter.currentTab = .home}, label: {
            Image(systemName: "arrow.backward").accentColor(.black)}),
                trailing:
                    Button(action: /*@START_MENU_TOKEN@*/{}/*@END_MENU_TOKEN@*/, label: {
                    Text("Select").accentColor(.black)
                }))
        }
    }
}

struct SubmittedView_Previews: PreviewProvider {
    static var previews: some View {
        submittedAuditsView().environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
    }
}

//
//  unsubmittedAuditsView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 12/1/20.
//

import SwiftUI

struct unsubmittedAuditsView: View {
    @EnvironmentObject var viewRouter: ViewRouter
    @Environment(\.managedObjectContext) private var viewContext
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Audit.lastUpdated, ascending: true)],
        predicate: NSPredicate(format: "submitted == false"),
        animation: .default)
    private var audits: FetchedResults<Audit>

    var body: some View{
        NavigationView() {
            VStack(alignment: .leading) {
                Text("Continue Audit").font(.largeTitle).padding()
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
                    Button(action: {viewRouter.currentTab = .home},
                           label: {Image(systemName: "arrow.backward").accentColor(.black)}),
                trailing:
                    Button(action: /*@START_MENU_TOKEN@*/{}/*@END_MENU_TOKEN@*/, label: {
                        HStack{
                            Image(systemName: "paperplane")
                            Text("SUBMIT ALL")

                        }
                        .padding(8)
                        .background(Color("green").opacity(Double(0.5)))
                        .foregroundColor(Color.white)
                        .cornerRadius(20)
                }))
        }
    }
}

let dateFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.dateStyle = .short
    formatter.timeStyle = .short
    return formatter
}()

struct UnsubmittedView_Previews: PreviewProvider {
    static var previews: some View {
        unsubmittedAuditsView().environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
    }
}

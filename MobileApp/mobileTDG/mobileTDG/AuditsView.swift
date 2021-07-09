//
//  AuditsView.swift
//  mobileTDG
//
//  Created by Diya Baliga on 2/14/21.
//
import SwiftUI

// allows the creation of lists with toggles
struct auditToggle: Identifiable {
    let id = UUID()
    var selected: Bool
    var audit: Audit
}

struct auditsView: View {
    @EnvironmentObject var viewRouter: ViewRouter
    @Environment(\.managedObjectContext) private var viewContext
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Audit.lastUpdated, ascending: true)],
        animation: .default)
    private var fetch: FetchedResults<Audit>
    
    @State private var audits = [auditToggle]()
    @State private var allAudits = [auditToggle]()
    @State private var submitStateFilter = 2
    @State private var selecting = false
    
    func formatForDisplay() {
        for audit in fetch {
            allAudits.append(auditToggle(selected: false, audit: audit))
        }
        filterAudits()
    }
    
    func filterAudits() {
        audits = allAudits.filter{
            switch submitStateFilter{
            case 0:
                return $0.audit.submitted == false
            case 1:
                return $0.audit.submitted == true
            default:
                return true
            }}
    }
    
 
    var body: some View{
        NavigationView {
            VStack(alignment: .leading) {
                Text("My Audits").font(.title).padding(20)
                Picker("", selection: $submitStateFilter) {
                    Text("In-progress").tag(0)
                    Text("Submitted").tag(1)
                    Text("All").tag(2)
                }
                .onChange(of: submitStateFilter, perform: { value in
                    filterAudits()
                })
                .onChange(of: selecting, perform: { value in
                    filterAudits()
                })
                .pickerStyle(SegmentedPickerStyle())
                .padding([.leading, .trailing], /*@START_MENU_TOKEN@*/10/*@END_MENU_TOKEN@*/).padding(.top, -5)
                Divider().padding([.bottom], 10)
                ScrollView {
                    ForEach(audits.indices, id: \.self){ idx in
                        HStack(alignment: .center) {

                        if(selecting) {
                            Toggle("", isOn: $audits[idx].selected).toggleStyle(LabellessToggleStyle()).padding(.trailing, 8)
                        }
                        Text(audits[idx].audit.name!).font(.title)
                        Spacer()
                            VStack(alignment: .trailing) {
                                // figure out how to have text right above divider
                                    Text("Last updated").fontWeight(.light)
                                Text(audits[idx].audit.lastUpdated!, formatter: DateFormatter()).fontWeight(.light)
                        }
                    }.padding([.leading,.trailing])
                        Divider().padding([.bottom], 10)
                    }
                }
                Spacer()
                if(selecting) {
                    Divider().background(Color.black)
                    HStack {
                        Button(action: {
                            for audit in audits {
                                if audit.selected {
                                    audit.audit.submitted = true
                                }
                            }
                            selecting = false
                        }, label: {
                            Text("Submit Selected")
                        })
                        Spacer()
                        Button(action: {
                            for id in 0...allAudits.count {
                                if allAudits[id].selected {
                                    // allAudits.remove(at: id)
                                    // come back to fix
                                    selecting = false
                                }
                                filterAudits()
                            }
                        }, label: {
                            Image(systemName: "trash")
                        })
                    }.padding([.leading,.trailing],20)
                    .padding([.top,.bottom], 10)
                }
            }
            .onAppear(perform: formatForDisplay)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading)
                    {
                    Button(action: {viewRouter.currentTab = .home}, label: {Image(systemName: "arrow.backward").accentColor(.black)})}
                ToolbarItemGroup(placement: .navigationBarTrailing)
                    {
                    Button(action: {selecting = !selecting}, label: { Text(!selecting ? "Select" : "Cancel").accentColor(.black)})
                    Button(action: {print("new audit!")}, label:{Image(systemName:"plus").accentColor(.black)})
                    }
            }
    }
}
}

struct auditsView_Previews: PreviewProvider {
    static var previews: some View {
        auditsView().environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
    }
}

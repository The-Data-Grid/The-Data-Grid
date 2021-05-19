//
//  mobileTDGApp.swift
//  mobileTDG
//
//  Created by Diya Baliga on 11/15/20.
//

import SwiftUI
import CoreData

@main
struct mobileTDGApp: App {
    let persistenceController = PersistenceController.shared
    @StateObject var viewRouter = ViewRouter()
    
    var body: some Scene {
        WindowGroup {
            motherView().environmentObject(viewRouter).environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
            // switch away from preview in real version
        }
    }
    
    
    func saveContext () {
        let context = persistenceController.container.viewContext
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                // add error handling
                let nsError = error as NSError
                fatalError("Unresolved error \(nsError), \(nsError.userInfo)")
            }
        }
    }
    
}

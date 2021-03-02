//
//  persistence.swift
//  mobileTDG
//
//  Created by Diya Baliga on 1/2/21.
//

import CoreData

struct PersistenceController {
    static let shared = PersistenceController()

    static var preview: PersistenceController = {
        let result = PersistenceController(inMemory: true)
        let viewContext = result.container.viewContext
        let unsubTest1 = Audit(context: viewContext)
        unsubTest1.name = "Test 1"
        unsubTest1.lastUpdated = Date()
        unsubTest1.submitted = false
        unsubTest1.id = UUID()
        let unsubTest2 = Audit(context: viewContext)
        unsubTest2.name = "Test 2"
        unsubTest2.lastUpdated = Date()
        unsubTest2.submitted = false
        unsubTest2.id = UUID()
        let subTest = Audit(context: viewContext)
        subTest.name = "Test 3"
        subTest.lastUpdated = Date()
        subTest.submitted = true
        subTest.id = UUID()
        do {
            try viewContext.save()
        } catch {
            // Replace this implementation with code to handle the error appropriately.
            // fatalError() causes the application to generate a crash log and terminate. You should not use this function in a shipping application, although it may be useful during development.
            let nsError = error as NSError
            fatalError("Unresolved error \(nsError), \(nsError.userInfo)")
        }
        return result
    }()

    let container: NSPersistentContainer

    init(inMemory: Bool = false) {
        container = NSPersistentContainer(name: "mobileTDG")
        if inMemory {
            container.persistentStoreDescriptions.first!.url = URL(fileURLWithPath: "/dev/null")
        }
        container.loadPersistentStores(completionHandler: { (storeDescription, error) in
            if let error = error as NSError? {
                // Replace this implementation with code to handle the error appropriately.
                // fatalError() causes the application to generate a crash log and terminate. You should not use this function in a shipping application, although it may be useful during development.

                /*
                Typical reasons for an error here include:
                * The parent directory does not exist, cannot be created, or disallows writing.
                * The persistent store is not accessible, due to permissions or data protection when the device is locked.
                * The device is out of space.
                * The store could not be migrated to the current model version.
                Check the error message to determine what the actual problem was.
                */
                fatalError("Unresolved error \(error), \(error.userInfo)")
            }
        })
    }
    
    func saveContext() {
        let context = container.viewContext
        
        if context.hasChanges {
            do{
                try context.save()
            } catch {
                fatalError("Unresolved error \(error), \(error.localizedDescription)")
            }
        }
    }
}

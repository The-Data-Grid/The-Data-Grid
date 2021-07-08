//
//  tt1.swift
//  mobileTDG
//
//  Created by David Trung Nguyen on 7/7/21.
//

import Foundation
import SwiftUI

struct Comments: Codable, Identifiable {
    let id = UUID()
    let name: String
    let email: String
    let body: String

}
class apiCall1 {
    func getUserComments(completion:@escaping ([Comments]) -> ()) {
        guard let url = URL(string: "https://jsonplaceholder.typicode.com/posts/1/comments") else { return }

        URLSession.shared.dataTask(with: url) { (data, _, _) in
            let comments = try! JSONDecoder().decode([Comments].self, from: data!)
            print(comments)

            DispatchQueue.main.async {
                completion(comments)
            }
        }
        .resume()
    }
}

struct ContentView11: View {
    //1.
    @State var comments = [Comments]()

    var body: some View {
        NavigationView {
            //3.
            List(comments) { comment in
                VStack(alignment: .leading) {
                    Text(comment.name)
                        .font(.title)
                        .fontWeight(.bold)
                    Text(comment.email)
                        .font(.subheadline)
                        .fontWeight(.bold)
                    Text(comment.body)
                        .font(.body)
                }

            }
            //2.
            .onAppear() {
                apiCall1().getUserComments { (comments) in
                    self.comments = comments
                }
            }.navigationTitle("Comments")
        }
    }
}



struct ContentView11_Previews: PreviewProvider {
    static var previews: some View {
        ContentView11().environmentObject(ViewRouter())

    }
}

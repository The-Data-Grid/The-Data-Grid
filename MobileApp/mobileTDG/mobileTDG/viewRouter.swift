//
//  viewRouter.swift
//  mobileTDG
//
//  Created by Diya Baliga on 12/1/20.
//

import SwiftUI

class ViewRouter: ObservableObject {
    @Published var currentPage: Page = .login
    @Published var currentTab: Tab = .home
}

enum Page {
    case login
    case tab
}

enum Tab {
    case home
    case settings
    case submitted
    case unsubmitted
    case detail
}

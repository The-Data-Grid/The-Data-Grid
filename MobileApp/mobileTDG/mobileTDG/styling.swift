//
//  styling.swift
//  mobileTDG
//
//  Created by Diya Baliga on 12/1/20.
//

import SwiftUI

// creates checkbox style for toggle components
struct CheckboxToggleStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        return HStack {
            configuration.label
            Spacer()
            Image(systemName: configuration.isOn ? "checkmark.square" : "square")
                .resizable()
                .frame(width: 20, height: 20)

                .onTapGesture { configuration.isOn.toggle() }
        }
    }
}

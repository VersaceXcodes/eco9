<React.Fragment>
  {/* Main Container */}
  <div className="min-h-screen bg-gray-50">
    {/* Header */}
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <button
            type="button"
            className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </header>

    {/* Profile Section */}
    <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl font-semibold text-gray-900 mb-8">Profile</h2>
      
      {/* Profile Form */}
      <form onSubmit={handleProfileSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={profileForm.name}
            onChange={handleProfileChange}
            className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Your full name"
          />
          {errors.profile?.name && (
            <p className="text-red-500 text-sm mt-1">{errors.profile?.name}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={profileForm.location}
            onChange={handleProfileChange}
            className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="City, Country"
          />
          {errors.profile?.location && (
            <p className="text-red-500 text-sm mt-1">{errors.profile?.location}</p>
          )}
        </div>

        {/* Eco Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Eco Interests
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {profileForm.ecoTags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-full text-blue-700 bg-blue-100"
              >
                {tag}
                <button
                  type="button"
                  className="ml-2 text-gray-500 hover:text-gray-700"
                  onClick={() => handleTagRemove(index)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add new interest..."
            value={newTag}
            onChange={handleTagInput}
            onKeyDown={handleTagKeyDown}
            className="mt-2 block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Profile Image */}
        <div className="flex items-center">
          <div className="flex-shrink-0 h-16 w-16">
            <img
              className="h-16 w-16 rounded-full object-cover"
              src={profileForm.profileImage || '/default-avatar.png'}
              alt="Profile"
            />
          </div>
          <div className="ml-4 flex-1">
            <label className="block text-sm font-medium text-gray-700">
              Upload Photo
            </label>
            <div className="mt-1 flex items-center space-x-4">
              <div className="flex-1">
                <label
                  htmlFor="profileImage"
                  className="border-2 border-gray-300 border-dashed rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="block">Upload a file</span>
                  <span className="block text-sm text-gray-500">PNG or JPG (max 5MB)</span>
                </label>
                <input
                  id="profileImage"
                  name="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <div>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </section>

    {/* Settings Section */}
    <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl font-semibold text-gray-900 mb-8">Settings</h2>
      
      <form onSubmit={handleSettingsSubmit} className="space-y-6">
        {/* Notifications */}
        <div className="space-y-3">
          <h3 className="text-xl font-medium text-gray-800">Notifications</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settingsForm.notifications.daily}
                onChange={(e) => handleSettingsChange('daily', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="daily" className="ml-3 block text-sm text-gray-700">
                Daily Digest
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settingsForm.notifications.weekly}
                onChange={(e) => handleSettingsChange('weekly', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="weekly" className="ml-3 block text-sm text-gray-700">
                Weekly Summary
              </label>
            </div>
          </div>
        </div>

        {/* Unit System */}
        <div>
          <h3 className="text-xl font-medium text-gray-800">Unit System</h3>
          <div className="mt-2">
            <div className="flex">
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="unitSystem"
                    value="metric"
                    checked={settingsForm.unitSystem === 'metric'}
                    onChange={handleUnitChange}
                    className="mr-2"
                  />
                  Metric (kg, km)
                </label>
              </div>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="unitSystem"
                    value="imperial"
                    checked={settingsForm.unitSystem === 'imperial'}
                    onChange={handleUnitChange}
                    className="mr-2"
                  />
                  Imperial (lbs, miles)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Data Privacy */}
        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settingsForm.dataPrivacy}
              onChange={(e) => setSettingsForm(prev => ({...prev, dataPrivacy: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="dataPrivacy" className="ml-3 block text-sm text-gray-700">
              Allow data sharing for environmental research
            </label>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            We take your privacy seriously. Learn more in our <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </form>
    </section>

    {/* Feedback Section */}
    <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl font-semibold text-gray-900 mb-8">Suggest New Activity</h2>
      
      <form onSubmit={handleFeedbackSubmit} className="space-y-6">
        <div>
          <label htmlFor="suggestion" className="block text-sm font-medium text-gray-700">
            Your Suggestion
          </label>
          <textarea
            id="suggestion"
            name="suggestion"
            rows={4}
            value={feedbackForm.suggestion}
            onChange={(e) => setFeedbackForm(prev => ({...prev, suggestion: e.target.value }))}
            className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe the activity you'd like to see..."
          />
          {errors.feedback && (
            <p className="text-red-500 text-sm mt-1">{errors.feedback}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={!feedbackForm.suggestion.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Suggestion
        </button>
      </form>
    </section>
  </div>
</React.Fragment>
/// Version control module for the task management system
/// This module ensures backward compatibility and safe upgrades
module task_manage::version;

use sui::package::Publisher;

// ==================== Error Codes ====================

const EInvalidPackageVersion: u64 = 100;
const EInvalidPublisher: u64 = 101;

// ==================== Constants ====================

/// Current package version
const VERSION: u64 = 1;

// ==================== Structs ====================

/// Shared Version object to verify package compatibility
public struct Version has key {
    id: UID,
    version: u64,
}

// ==================== Init Function ====================

/// Initialize and share the Version object
/// This should be called once during package deployment
fun init(ctx: &mut TxContext) {
    let version_obj = Version {
        id: object::new(ctx),
        version: VERSION,
    };
    transfer::share_object(version_obj);
}

// ==================== Public Functions ====================

/// Check if the version is valid
/// Aborts with EInvalidPackageVersion if version doesn't match
public fun check_is_valid(version: &Version) {
    assert!(version.version == VERSION, EInvalidPackageVersion);
}

/// Migrate the version object to the current VERSION
/// This function should be called after package upgrade to update the shared Version object
/// Only the package publisher can call this function
public fun migrate(publisher: &Publisher, version: &mut Version) {
    assert!(publisher.from_package<Version>(), EInvalidPublisher);
    version.version = VERSION;
}

/// Get the current version value
public fun version(version: &Version): u64 {
    version.version
}

// ==================== Test-Only Functions ====================

#[test_only]
/// Initialize version for testing purposes
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}

#[test_only]
/// Test-only function to set version to a specific value (for testing invalid versions)
public fun set_version_for_testing(version: &mut Version, new_version: u64) {
    version.version = new_version;
}
